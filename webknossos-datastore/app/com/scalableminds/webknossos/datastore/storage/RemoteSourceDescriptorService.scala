package com.scalableminds.webknossos.datastore.storage

import com.scalableminds.util.tools.Fox
import com.scalableminds.webknossos.datastore.dataformats.MagLocator
import com.scalableminds.webknossos.datastore.datavault.VaultPath
import com.scalableminds.webknossos.datastore.services.DSRemoteWebKnossosClient

import java.net.URI
import javax.inject.Inject
import scala.concurrent.ExecutionContext

case class RemoteSourceDescriptor(uri: URI, credential: Option[DataVaultCredential])

class RemoteSourceDescriptorService @Inject()(dSRemoteWebKnossosClient: DSRemoteWebKnossosClient,
                                              dataVaultService: DataVaultService) {

  def vaultPathFor(magLocator: MagLocator)(implicit ec: ExecutionContext): Fox[VaultPath] =
    for {
      remoteSourceDescriptor <- remoteSourceDescriptorFor(magLocator)
      vaultPath <- dataVaultService.getVaultPath(remoteSourceDescriptor)
    } yield vaultPath

  def removeVaultFromCache(magLocator: MagLocator)(implicit ec: ExecutionContext): Fox[Unit] =
    for {
      remoteSource <- remoteSourceDescriptorFor(magLocator)
      _ = dataVaultService.removeVaultFromCache(remoteSource)
    } yield ()

  private def remoteSourceDescriptorFor(magLocator: MagLocator)(
      implicit ec: ExecutionContext): Fox[RemoteSourceDescriptor] =
    for {
      credentialBox <- credentialFor(magLocator: MagLocator).futureBox
      remoteSource = RemoteSourceDescriptor(magLocator.uri, credentialBox.toOption)
    } yield remoteSource

  private def credentialFor(magLocator: MagLocator)(implicit ec: ExecutionContext): Fox[DataVaultCredential] =
    magLocator.credentialId match {
      case Some(credentialId) =>
        dSRemoteWebKnossosClient.getCredential(credentialId)
      case None =>
        magLocator.credentials match {
          case Some(credential) => Fox.successful(credential)
          case None             => Fox.empty
        }
    }
}